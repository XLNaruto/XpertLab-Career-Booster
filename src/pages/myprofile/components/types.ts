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

export interface ProfileFormData {
  // Personal Details
  profilePhoto: File | null;
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

  // Location Details
  state: string;
  city: string;
  address: string;

  // Guardian Details
  guardians: Guardian[];

  // Education Details
  educations: Education[];

  // Course Details
  course: string;
  traineeArea: string;
  batchDay: string;
  batchTime: string;
  joiningDate: Date | null;
  device: string;
  computer: string;

  // Documents
  aadharNumber: string;
  documents: (File | null)[];
}
