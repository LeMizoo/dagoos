export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  slug: string;
  type: 'FLEET_MANAGER' | 'COOPERATIVE';
  email: string;
  plan: string;
  status: string;
  paymentStatus?: string;
}

export interface Driver {
  id: string;
  userId: string;
  organizationId: string;
  driverCode: string;
  vehicleId?: string;
  status: string;
}

export interface Vehicle {
  id: string;
  organizationId?: string;
  plate: string;
  model?: string;
  year?: number;
  currentKm: number;
  status: string;
}
