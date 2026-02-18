export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Board = {
  id: string;
  name: string;
};

export type Role = "admin" | "editor" | "viewer";

export type BoardMember = User & {
  role: Role;
};

export type Priority = "P0" | "P1" | "P2" | "P3";

export type Column = {
  id: string;
  name: string;
  board_id: string;
  wip_limit: number | null;
  order: number;
};

export type Lane = {
  id: string;
  name: string;
  board_id: string;
  color: string;
  order: number;
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type Comment = {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  owner_id: string | null;
  column_id: string;
  lane_id: string | null;
  epic_id: string | null;
  feature_id: string | null;
  checklist: ChecklistItem[];
  comments: Comment[];
  order: number;
};

export type CardTemplate = {
  id: string;
  name: string;
  board_id: string;
  template_data: Partial<Card>;
};

export type CustomField = {
  id: string;
  name: string;
  field_type: "text" | "number" | "select";
  options?: string[];
  board_id: string;
};

export type CardCustomValue = {
  field_id: string;
  value: string | number | null;
};
