export interface Guardian {
  type: string;
  relation: string;
  firstName: string;
  lastName: string;
  mobile1: string;
  mobile2: string;
}

export interface Education {
  educationType: string;
  education: string;
  board: string;
  institute: string;
  passingYear: Date | null;
  academicYear: Date | null;
  percentage: string;
  educationCompleted: boolean;
  educationDocument: File | null;
}

export interface RegisterFormData {
  // Step 1: Personal Details
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
  state: string;
  city: string;
  address: string;

  // Step 3: Guardian Details
  guardians: Guardian[];

  // Step 4: Education Details
  educations: Education[];

  // Step 5: Course Details
  course: string;
  traineeArea: string;
  batchDay: string;
  batchTime: string;
  joiningDate: Date | null;
  device: string;
  computer: string;

  // Step 6: Documents
  aadharNumber: string;
  documents: (File | null)[];
}
