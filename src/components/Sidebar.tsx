import FileUploader from "@/components/FileUploader";
import SplitValueItem from "@/components/SplitValueItem";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  FileLayersStateProps,
  GeoJSONData,
  GeoJSONFeature,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlignJustifyIcon, Trash2Icon } from "lucide-react";
import { forwardRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OuterScrollWrapper = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      "h-[400px] w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
    )}
  />
));

const Sidebar = ({ fileLayers, setFileLayers }: FileLayersStateProps) => {
  // File removal function
  const removeFileLayer = (id: string) => {
    setFileLayers((prev) => prev.filter((fl) => fl.id !== id));
  };

  // Toggle layer visibility
  const toggleFileVisibility = (id: string) => {
    setFileLayers((prev) =>
      prev.map((fl) => (fl.id === id ? { ...fl, visible: !fl.visible } : fl))
    );
  };

  // Update Split Property for a File Layer
  const updateSplitProperty = (id: string, property: string) => {
    setFileLayers((prev) =>
      prev.map((fl) => (fl.id === id ? { ...fl, splitProperty: property } : fl))
    );
  };

  // Reset Split for a File Layer
  const resetSplitForLayer = (id: string) => {
    setFileLayers((prev) =>
      prev.map((fl) =>
        fl.id === id
          ? {
              ...fl,
              splitProperty: undefined,
              splitGeoJsonData: undefined,
              splitValues: undefined,
              splitVisibleFeatures: undefined,
            }
          : fl
      )
    );
  };

  // Handle Split Logic for a Specific File Layer
  const handleSplit = (id: string) => {
    setFileLayers((prev) =>
      prev.map((fl) => {
        if (fl.id !== id || !fl.splitProperty) return fl;

        const property = fl.splitProperty;
        const groupedByProperty: { [key: string]: GeoJSONFeature[] } = {};
        const uniqueValues: Set<string> = new Set();

        // Group features by the selected property.
        fl.geoJsonData.features.forEach((feature) => {
          const value = feature.properties[property];
          if (value) {
            const valueStr = String(value);
            uniqueValues.add(valueStr);
            if (!groupedByProperty[valueStr]) {
              groupedByProperty[valueStr] = [];
            }
            groupedByProperty[valueStr].push(feature);
          }
        });

        // Sort unique values alphabetically
        const sortedValues = Array.from(uniqueValues).sort((a, b) =>
          a.localeCompare(b)
        );

        // Create a new GeoJSON (MultiPolygon) merging features by property.
        const newFeatures = sortedValues.map((key) => {
          const mergedCoordinates = groupedByProperty[key].reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc: any[], feature: GeoJSONFeature) => {
              if (feature.geometry.type === "Polygon") {
                return [...acc, feature.geometry.coordinates];
              } else if (feature.geometry.type === "MultiPolygon") {
                return [...acc, ...feature.geometry.coordinates];
              }
              return acc;
            },
            []
          );

          return {
            type: "Feature",
            properties: { [property]: key },
            geometry: {
              type: "MultiPolygon",
              coordinates: mergedCoordinates,
            },
          };
        });

        const splitGeoJsonData: GeoJSONData = {
          type: "FeatureCollection",
          features: newFeatures,
        };

        const splitVisibleFeatures: { [key: string]: boolean } = {};
        sortedValues.forEach((val) => {
          splitVisibleFeatures[val] = true;
        });

        return {
          ...fl,
          splitGeoJsonData,
          splitValues: sortedValues,
          splitVisibleFeatures,
        };
      })
    );
  };

  // Toggle Visibility for a Specific Split Value in a File Layer
  const toggleSplitValueVisibility = (fileId: string, value: string) => {
    setFileLayers((prev) =>
      prev.map((fl) => {
        if (fl.id !== fileId || !fl.splitVisibleFeatures) return fl;
        const newSplitVisibleFeatures = { ...fl.splitVisibleFeatures };
        newSplitVisibleFeatures[value] = !newSplitVisibleFeatures[value];

        return { ...fl, splitVisibleFeatures: newSplitVisibleFeatures };
      })
    );
  };

  // Toggle All Split Values Visibility for a File Layer
  const toggleAllSplitValuesVisibility = (fileId: string, checked: boolean) => {
    setFileLayers((prev) =>
      prev.map((fl) => {
        if (fl.id !== fileId || !fl.splitVisibleFeatures) return fl;

        const updatedSplitVisibleFeatures = Object.fromEntries(
          Object.keys(fl.splitVisibleFeatures).map((key) => [key, checked])
        );

        return { ...fl, splitVisibleFeatures: updatedSplitVisibleFeatures };
      })
    );
  };

  // Update color for a split value
  const updateSplitColor = useCallback(
    (fileId: string, splitValue: string, color: string) => {
      setFileLayers((prev) =>
        prev.map((fl) => {
          if (fl.id !== fileId) return fl;
          const newSplitColors = { ...fl.splitColors, [splitValue]: color };

          return { ...fl, splitColors: newSplitColors };
        })
      );
    },
    [setFileLayers]
  );

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          className="absolute z-20 m-4 border bg-slate-50 hover:bg-slate-50/90 border-input"
          size="icon"
        >
          <AlignJustifyIcon className="w-6 h-6 text-black" size={28} />
        </Button>
      </SheetTrigger>
      <SheetContent
        onInteractOutside={(e: Event) => {
          e.preventDefault();
        }}
        className="p-0 overflow-y-auto bg-white/70 backdrop-blur-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle>Layers</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-5 mt-4">
          <FileUploader fileLayers={fileLayers} setFileLayers={setFileLayers} />
          <Accordion type="single" collapsible className="w-full">
            {fileLayers.map((fl) => (
              <AccordionItem
                key={fl.id}
                value={fl.id}
                className="border-b border-gray-300"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fl.visible}
                    onCheckedChange={() => toggleFileVisibility(fl.id)}
                  />
                  <AccordionTrigger>
                    <span
                      className="text-base font-semibold leading-none"
                      style={{ color: fl.color }}
                    >
                      {fl.fileName}
                    </span>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-7 w-7 text-destructive hover:bg-transparent hover:text-destructive/90"
                    onClick={() => removeFileLayer(fl.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </div>
                <AccordionContent>
                  <div className="mt-1 space-y-2 text-sm text-gray-700">
                    {fl.splitGeoJsonData ? (
                      <div className="px-1 space-y-1">
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                fl.splitValues?.every(
                                  (value) => fl.splitVisibleFeatures?.[value]
                                ) ?? false
                              }
                              onCheckedChange={(checked) =>
                                toggleAllSplitValuesVisibility(
                                  fl.id,
                                  checked as boolean
                                )
                              }
                            />
                            <span className="font-semibold">
                              Split by: {fl.splitProperty}
                            </span>
                          </div>
                          <Button
                            onClick={() => resetSplitForLayer(fl.id)}
                            variant={"destructive"}
                            size={"sm"}
                          >
                            Reset
                          </Button>
                        </div>
                        {fl.splitValues &&
                          (() => {
                            const listHeight = Math.min(
                              fl.splitValues.length * 28,
                              10 * 28
                            );
                            return (
                              <List
                                height={listHeight}
                                itemCount={fl.splitValues.length}
                                itemSize={28}
                                width="100%"
                                outerElementType={OuterScrollWrapper}
                                style={{ backgroundColor: "transparent" }}
                              >
                                {({
                                  index,
                                  style,
                                }: {
                                  index: number;
                                  style: React.CSSProperties;
                                }) => {
                                  const value = fl.splitValues![index]; // Use non-null assertion
                                  return (
                                    <div style={style} key={value}>
                                      <SplitValueItem
                                        fileId={fl.id}
                                        value={value}
                                        checked={
                                          fl.splitVisibleFeatures?.[value] ??
                                          true
                                        }
                                        toggleVisibility={
                                          toggleSplitValueVisibility
                                        }
                                        updateColor={updateSplitColor}
                                      />
                                    </div>
                                  );
                                }}
                              </List>
                            );
                          })()}
                      </div>
                    ) : (
                      <div className="flex gap-2 px-0.5 items-center">
                        <Select
                          value={fl.splitProperty ?? ""}
                          onValueChange={(value) =>
                            updateSplitProperty(fl.id, value)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select Property to Split" />
                          </SelectTrigger>
                          <SelectContent>
                            {fl.geoJsonData.features[0]?.properties &&
                              Object.keys(
                                fl.geoJsonData.features[0].properties
                              ).map((prop) => (
                                <SelectItem key={prop} value={prop}>
                                  {prop}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleSplit(fl.id)}
                          disabled={!fl.splitProperty}
                          size={"sm"}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
