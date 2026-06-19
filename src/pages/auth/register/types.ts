export interface Guardian {
  traineeguardiandetailId: string;
  guardianType: string;
  relation: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  mobileNumber2: string;
}

export interface Education {
  traineeeducationdetailId: string;
  educationType: string;
  education: string;
  boardId: string;
  instituteId: string;
  passingYear: string;
  academicYear: string;
  percentage: string;
  isCompleted: string;
  document: string;
  url: string;
  showInCertificate: string;
}

export interface RegisterFormData {
  // Server-issued after step 1 save
  traineeId: string;

  // Step 1: Personal Details
  profilePicture: File | string | null;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  birthDate: Date | null;
  email: string;
  mobile1: string;
  mobile2: string;
  userName: string;
  password: string;
  confirmPassword: string;

  // Step 2: Location Details
  // Current address
  stateId: string;
  cityId: string;
  address: string;
  // Permanent address
  permanentStateId: string;
  permanentCityId: string;
  permanentAddress: string;

  // Step 3: Guardian Details
  guardians: Guardian[];

  // Step 4: Education Details
  educations: Education[];

  // Step 5: Course Details
  traineecourseId: string;
  course: string;
  enrollmentType: string;
  traineeArea: string;
  batchDay: string;
  batchTime: string;
  joiningDate: Date | null;
  hasLaptop: number | null;
  computerId: string;

  // Step 6: Documents
  aadharNumber: string;
  documents: TraineeDocument[];
}

export interface TraineeDocument {
  traineedocumentId: string;
  name: string;
  isCompulsory: number | boolean;
  document: string;
  url: string;
}
