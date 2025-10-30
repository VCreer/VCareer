import { mapEnumToOptions } from '@abp/ng.core';

export enum PositionType {
  Employee = 1,
  TeamLead = 2,
  Manager = 3,
  Supervisor = 4,
  BranchManager = 5,
  DeputyDirector = 6,
  Director = 7,
  Intern = 8,
  Specialist = 9,
  SeniorSpecialist = 10,
  Expert = 11,
  Consultant = 12,
}

export const positionTypeOptions = mapEnumToOptions(PositionType);
