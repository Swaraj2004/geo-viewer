interface BasemapToggleProps {
  satelliteMap: boolean;
  setSatelliteMap: (value: boolean) => void;
}

const BasemapToggle = ({
  satelliteMap,
  setSatelliteMap,
}: BasemapToggleProps) => {
  return (
    <div
      className="absolute right-0 z-20 m-4 border-2 border-gray-600 rounded-lg cursor-pointer w-14 h-14"
      onClick={() => setSatelliteMap(!satelliteMap)}
    >
      <img
        src={satelliteMap ? "/images/basic.png" : "/images/satellite.png"}
        alt={satelliteMap ? "basic" : "satellite"}
        className="w-full h-full rounded-md"
      />
    </div>
  );
};

export default BasemapToggle;
