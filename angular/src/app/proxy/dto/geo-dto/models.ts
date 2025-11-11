
export interface DistrictDto {
  code?: number;
  name?: string;
  wards: WardDto[];
}

export interface ProvinceDto {
  code?: number;
  name?: string;
  districts: DistrictDto[];
}

export interface WardDto {
  code?: number;
  name?: string;
  division_type?: string;
}
