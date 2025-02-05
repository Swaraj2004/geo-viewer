/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction } from "react";

export type GeoJSONFeature = {
  type: string;
  properties: {
    id?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
};

export type GeoJSONData = {
  type: string;
  name?: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: GeoJSONFeature[];
};

export type FileLayer = {
  id: string;
  fileName: string;
  geoJsonData: GeoJSONData;
  visible: boolean;
  color: string;
  // Split-related properties (optional)
  splitProperty?: string;
  splitGeoJsonData?: GeoJSONData;
  splitValues?: string[];
  splitVisibleFeatures?: { [key: string]: boolean };
  splitColors?: { [key: string]: string };
};

export type FileLayersStateProps = {
  fileLayers: FileLayer[];
  setFileLayers: Dispatch<SetStateAction<FileLayer[]>>;
};
