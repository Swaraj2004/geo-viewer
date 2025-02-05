/* eslint-disable @typescript-eslint/no-explicit-any */
import BasemapToggle from "@/components/BasemapToggle";
import type { FileLayer } from "@/lib/types";
import { darken } from "@/lib/utils";
import { FillLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import { ExpressionSpecification } from "maplibre-gl";
import { useEffect, useState } from "react";
import Map, { Layer, Popup, Source } from "react-map-gl/maplibre";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MapContainerProps {
  fileLayers: FileLayer[];
  selectedFeature: {
    id: string;
    name: string;
    coordinates: [number, number];
  } | null;
  setSelectedFeature: React.Dispatch<React.SetStateAction<any>>;
}

const MapContainer = ({
  fileLayers,
  selectedFeature,
  setSelectedFeature,
}: MapContainerProps) => {
  const [satelliteMap, setSatelliteMap] = useState(false);
  const [maptilerApiKey, setMaptilerApiKey] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("maptiler_api_key");
    if (!storedApiKey) {
      setIsApiKeyDialogOpen(true);
    } else {
      setMaptilerApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("maptiler_api_key", tempApiKey);
    setMaptilerApiKey(tempApiKey);
    setIsApiKeyDialogOpen(false);
  };

  const handleMapClick = (event: any) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedFeature(null);
      return;
    }

    // First try the "id" property
    let featureId = feature.properties.id;
    let featureName = feature.properties.name || feature.properties.id;

    // If not available, attempt to determine the split property from the layer.
    if (!featureId) {
      // The layer id is set as "layer-{fileLayer.id}"
      const layerId = feature.layer.id;
      if (layerId && layerId.startsWith("layer-")) {
        const fileLayerId = layerId.replace("layer-", "");
        const fileLayer = fileLayers.find((fl) => fl.id === fileLayerId);
        if (fileLayer && fileLayer.splitProperty) {
          featureId = feature.properties[fileLayer.splitProperty];
          featureName = featureId;
        }
      }
    }

    if (featureId) {
      setSelectedFeature({
        id: featureId,
        name: featureName || featureId,
        coordinates: [event.lngLat.lng, event.lngLat.lat],
      });
    } else {
      setSelectedFeature(null);
    }
  };

  const getLayerPaint = (
    fileLayer: FileLayer,
    isSplit: boolean,
    selected: { id: string } | null
  ): FillLayerSpecification["paint"] => {
    const field = isSplit ? fileLayer.splitProperty ?? "id" : "id";

    if (isSplit && fileLayer.splitColors) {
      return {
        "fill-color": [
          "case",
          ["==", ["get", field], selected?.id ?? ""],
          darken(fileLayer.color, 0.3), // Highlight selected feature
          ...Object.entries(fileLayer.splitColors).flatMap(([value, color]) => [
            ["==", ["get", field], value], // Condition
            color, // Assigned color
          ]),
          fileLayer.color, // Default color if none match
        ] as ExpressionSpecification,
        "fill-outline-color": [
          "case",
          ["==", ["get", field], selected?.id ?? ""],
          "#1a1a1a", // Darker outline for selected feature
          "#666", // Default outline
        ],
        "fill-opacity": 0.66,
      };
    }

    return {
      "fill-color": [
        "case",
        ["==", ["get", field], selected?.id ?? ""],
        darken(fileLayer.color, 0.3), // Highlight selected
        fileLayer.color, // Default color
      ],
      "fill-outline-color": [
        "case",
        ["==", ["get", field], selected?.id ?? ""],
        "#1a1a1a", // Darker outline for selected
        "#666", // Default outline
      ],
      "fill-opacity": 0.66,
    };
  };

  // Build an array of interactive layer IDs from all visible layers.
  // (Whether split or unsplit, we set the layer id as `layer-${fl.id}`)
  const interactiveLayerIds = fileLayers
    .filter((fl) => fl.visible)
    .map((fl) => `layer-${fl.id}`);

  return (
    <>
      <BasemapToggle
        satelliteMap={satelliteMap}
        setSatelliteMap={setSatelliteMap}
      />
      <AlertDialog open={isApiKeyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome to GeoViewer 🌍</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-gray-600">
              Please enter your MapTiler API key to use satellite maps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="Enter API key"
          />
          <AlertDialogFooter>
            <Button onClick={handleSaveApiKey} disabled={!tempApiKey.trim()}>
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Map
        initialViewState={{ longitude: 80, latitude: 22, zoom: 4 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={
          satelliteMap
            ? `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerApiKey}`
            : "https://tiles.openfreemap.org/styles/liberty"
        }
        onClick={handleMapClick}
        interactiveLayerIds={interactiveLayerIds}
      >
        {fileLayers.map((fl) => {
          if (!fl.visible) return null;

          if (
            fl.splitGeoJsonData &&
            fl.splitProperty &&
            fl.splitVisibleFeatures
          ) {
            const visibleSplitValues = Object.keys(
              fl.splitVisibleFeatures
            ).filter((v) => fl.splitVisibleFeatures![v]);
            return (
              <Source
                key={fl.id}
                id={`source-${fl.id}`}
                type="geojson"
                data={fl.splitGeoJsonData}
              >
                <Layer
                  id={`layer-${fl.id}`}
                  type="fill"
                  paint={getLayerPaint(fl, true, selectedFeature)}
                  filter={[
                    "in",
                    ["get", fl.splitProperty],
                    ["literal", visibleSplitValues],
                  ]}
                />
              </Source>
            );
          } else {
            return (
              <Source
                key={fl.id}
                id={`source-${fl.id}`}
                type="geojson"
                data={fl.geoJsonData}
              >
                <Layer
                  id={`layer-${fl.id}`}
                  type="fill"
                  paint={getLayerPaint(fl, false, selectedFeature)}
                />
              </Source>
            );
          }
        })}
        {selectedFeature && (
          <Popup
            longitude={selectedFeature.coordinates[0]}
            latitude={selectedFeature.coordinates[1]}
            closeButton={false}
            onClose={() => setSelectedFeature(null)}
          >
            <h3 className="text-sm font-bold">{selectedFeature.name}</h3>
          </Popup>
        )}
      </Map>
    </>
  );
};

export default MapContainer;
