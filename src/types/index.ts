export type UserRole = 'user' | 'pharmacy' | 'hospital' | 'bloodTestCentre';

export type MedicineStatus = 'safe' | 'expiring' | 'expired';

export type AddMethod = 'pharmacy' | 'csv' | 'scan' | 'manual';

export type RestockStatus = 'pending' | 'accepted' | 'rejected' | 'fulfilled';

export type BookingStatus = 'pending' | 'accepted' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  mobileVerified: boolean;
  role: UserRole;
  profileCompletion: number;
  avatar?: string;
}

export interface Medicine {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  status: MedicineStatus;
}

export interface UserMedicine extends Medicine {
  userId: string;
  addedMethod: AddMethod;
  dosage?: string;
  prescribedDoses?: number;
  dosesTaken?: number;
}

export interface PharmacyInventory extends Medicine {
  pharmacyId: string;
}

export interface SaleRecord {
  id: string;
  pharmacyId: string;
  customerMobile: string;
  medicineName: string;
  quantity: number;
  saleDate: string;
}

export interface CSVUpload {
  id: string;
  pharmacyId: string;
  uploadDate: string;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
}

export interface RestockRequest {
  id: string;
  userId: string;
  userName: string;
  medicineName: string;
  requestedQuantity: number;
  status: RestockStatus;
  requestDate: string;
}

export interface HospitalInventory extends Medicine {
  hospitalId: string;
}

export interface BloodTestBooking {
  id: string;
  userId: string;
  userName: string;
  testType: string;
  appointmentDate: string;
  status: BookingStatus;
}

export interface MedicationAdherence {
  id: string;
  userId: string;
  medicineName: string;
  dosesTaken: number;
  totalPrescribedDose: number;
  adherenceScore: number;
}

export interface DashboardStats {
  totalMedicines: number;
  expiringSoon: number;
  expired: number;
  lowStock: number;
  savedFromExpiry?: number;
}
