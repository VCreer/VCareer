import { Component, OnInit } from '@angular/core';
import { GeoService } from '../../../../core/services/Geo.service';
import type { ProvinceDto, DistrictDto, WardDto } from '../../../../proxy/dto/geo-dto';

@Component({
  selector: 'app-location-selector',
  templateUrl: './location-selector.component.html',
})
export class LocationSelectorComponent implements OnInit {
  provinces: ProvinceDto[] = [];
  districts: DistrictDto[] = [];
  wards: WardDto[] = [];

  selectedProvince?: number;
  selectedDistrict?: number;
  selectedWard?: number;

  constructor(private geoService: GeoService) {}

  ngOnInit() {
    this.geoService.getProvinces().subscribe((data) => {
      this.provinces = data || [];
    });
  }

  onProvinceChange() {
    if (!this.selectedProvince) {
      this.districts = [];
      this.wards = [];
      return;
    }

    this.geoService.getDistrictsByProvince(this.selectedProvince).subscribe((data) => {
      this.districts = data;
      this.wards = [];
      this.selectedDistrict = undefined;
      this.selectedWard = undefined;
    });
  }

  onDistrictChange() {
    if (!this.selectedDistrict) {
      this.wards = [];
      return;
    }

    this.geoService.getWardsByDistrict(this.selectedDistrict).subscribe((data) => {
      this.wards = data;
      this.selectedWard = undefined;
    });
  }
  
}
