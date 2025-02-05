import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { availableColors } from "@/lib/constants";
import { FileLayer, FileLayersStateProps, GeoJSONData } from "@/lib/types";
import * as shapefile from "shapefile";

const FileUploader = ({ fileLayers, setFileLayers }: FileLayersStateProps) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Save the current fileLayers length to use for color calculation.
    const currentFileCount = fileLayers.length;

    // Group files by their base name (e.g., "example.shp" and "example.dbf" should be grouped together).
    const fileGroups: { [key: string]: File[] } = {};

    Array.from(files).forEach((file) => {
      const baseName = file.name.replace(/\.(shp|dbf|geojson)$/, "");
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      fileGroups[baseName].push(file);
    });

    // Process each file group.
    Object.values(fileGroups).forEach((fileGroup, index) => {
      const shpFile = fileGroup.find((file) => file.name.endsWith(".shp"));
      const dbfFile = fileGroup.find((file) => file.name.endsWith(".dbf"));
      const geojsonFile = fileGroup.find((file) =>
        file.name.endsWith(".geojson")
      );

      if (geojsonFile) {
        // Handle GeoJSON file.
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data: GeoJSONData = JSON.parse(e.target?.result as string);

            // Ensure each feature has a unique id.
            data.features.forEach((feature, i) => {
              if (!feature.properties) feature.properties = {};
              if (!feature.properties.id)
                feature.properties.id = `feature-${i}`;
            });

            // Create a new file layer object.
            const newFileLayer: FileLayer = {
              id: `${geojsonFile.name.replace(
                /\.geojson$/,
                ""
              )}-${Date.now()}-${index}`,
              fileName: geojsonFile.name.replace(/\.geojson$/, ""),
              geoJsonData: data,
              visible: true,
              color:
                availableColors[
                  (currentFileCount + index) % availableColors.length
                ],
            };

            setFileLayers((prev) => [...prev, newFileLayer]);
          } catch (error) {
            console.error("Invalid GeoJSON file.", error);
          }
        };
        reader.readAsText(geojsonFile);
      } else if (shpFile) {
        // Handle Shapefile (.shp and .dbf).
        const shpReader = new FileReader();
        const dbfReader = new FileReader();

        shpReader.onload = async (e) => {
          try {
            const shpBuffer = e.target?.result as ArrayBuffer;
            const dbfBuffer = dbfFile
              ? (dbfReader.result as ArrayBuffer)
              : undefined;

            // Convert Shapefile to GeoJSON.
            const geoJsonData = await shapefile.read(shpBuffer, dbfBuffer);

            // Ensure each feature has a unique id.
            geoJsonData.features.forEach((feature, i) => {
              if (!feature.properties) feature.properties = {};
              if (!feature.properties.id)
                feature.properties.id = `feature-${i}`;
            });

            // Create a new file layer object.
            const newFileLayer: FileLayer = {
              id: `${shpFile.name.replace(
                /\.shp$/,
                ""
              )}-${Date.now()}-${index}`,
              fileName: shpFile.name.replace(/\.shp$/, ""),
              geoJsonData: geoJsonData as GeoJSONData,
              visible: true,
              color:
                availableColors[
                  (currentFileCount + index) % availableColors.length
                ],
            };

            setFileLayers((prev) => [...prev, newFileLayer]);
          } catch (error) {
            console.error("Error reading Shapefile.", error);
          }
        };

        if (dbfFile) {
          dbfReader.onload = () => {
            // Once the .dbf file is read, read the .shp file.
            shpReader.readAsArrayBuffer(shpFile);
          };
          dbfReader.readAsArrayBuffer(dbfFile);
        } else {
          // If no .dbf file is provided, read the .shp file directly.
          shpReader.readAsArrayBuffer(shpFile);
        }
      } else {
        console.error("Unsupported file type or missing .shp file.");
      }
      // Reset the input field so the same file can be uploaded again
      event.target.value = "";
    });
  };

  return (
    <div className="grid items-center w-full max-w-sm gap-2">
      <Label htmlFor="upload">Upload Shapefile (.shp + .dbf) or GeoJSON</Label>
      <Input
        id="upload"
        type="file"
        accept=".geojson,.shp,.dbf"
        multiple
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default FileUploader;
