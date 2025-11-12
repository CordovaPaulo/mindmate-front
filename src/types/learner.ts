export interface RoleData{
  role: string;
  altRole: string | null;
}

export interface UserData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  address: string;
  yearLevel: string;
  program: string;
  availability: string[];
  sessionDur: string;
  bio: string;
  subjects: string[];
  image: string;
  phoneNumber: string;
  style: string[];
  goals: string;
  sex: string;
  status: string;
  modality: string;
  createdAt: string;
  __v: number;
}

export interface Schedule {
  id: string;
  date: string;
  time: string;
  subject: string;
  location: string;
  mentor: {
    id: string;
    name: string;
    program: string;
    yearLevel: string;
    image: string;
  };
  learner: {
    id: string;
    name: string;
    program: string;
    yearLevel: string;
  };
  feedback?: {
    rating: number;
    feedback: string;
  };
  has_feedback?: boolean;
}

export interface MentorFile {
  id: number;
  name: string;
  url: string;
  type: string;
  owner_id: number;
  file_id: string;
  file_name: string;
}

export interface Mentor {
  id: number;
  userName: string;
  yearLevel: string;
  course: string;
  image_id: string;
  proficiency: string;
  subjects: string[];
  availability: string[];
  rating_ave: number;
  bio: string;
  exp: string;
  prefSessDur: string;
  teach_sty: string[];
  credentials: string[];
  image_url: string;
}

export interface MentorFromAPI {
  id: string;
  name: string;
  program: string;
  yearLevel: string;
  image: string;
  aveRating: number;
  proficiency: string
}

export interface TransformedMentor {
  id: string;
  userName: string;
  yearLevel: string;
  course: string;
  image_url: string;
  proficiency: string;
  rating_ave: number;
}