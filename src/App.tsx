import MapContainer from "@/components/MapContainer";
import Sidebar from "@/components/Sidebar";
import type { FileLayer } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

function App() {
  const [fileLayers, setFileLayers] = useState<FileLayer[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<{
    id: string;
    name: string;
    coordinates: [number, number];
  } | null>(null);

  return (
    <div className="relative w-screen h-screen">
      <Sidebar fileLayers={fileLayers} setFileLayers={setFileLayers} />
      <MapContainer
        fileLayers={fileLayers}
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
      />
    </div>
  );
}

export default App;
