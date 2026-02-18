import { supabase } from "./supabase";
import type {
  Board,
  Column,
  Card,
  Lane,
  User,
  ChecklistItem,
  Comment,
  Priority,
} from "./types";

// ─── Helpers ───────────────────────────────────────────────

function mapRow<T>(row: Record<string, unknown>): T {
  return row as unknown as T;
}

// ─── Auth / Users ──────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    avatarUrl: u.avatar_url,
  }));
}

// ─── Boards ────────────────────────────────────────────────

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("id, name")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Board[];
}

export async function createBoard(name: string, ownerId: string): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({ name, owner_id: ownerId })
    .select("id, name")
    .single();
  if (error) throw error;

  // Also add owner as admin member
  await supabase.from("board_members").insert({
    board_id: data.id,
    user_id: ownerId,
    role: "admin",
  });

  // Create default columns
  const defaultColumns = ["Backlog", "To Do", "In Progress", "Review", "Done"];
  for (let i = 0; i < defaultColumns.length; i++) {
    await supabase.from("columns").insert({
      board_id: data.id,
      name: defaultColumns[i],
      order: i,
      wip_limit: null,
    });
  }

  return data as Board;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw error;
}

// ─── Columns ───────────────────────────────────────────────

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("order");
  if (error) throw error;
  return (data ?? []) as Column[];
}

export async function createColumn(
  boardId: string,
  name: string,
  order: number,
  wipLimit: number | null = null
): Promise<Column> {
  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, name, order, wip_limit: wipLimit })
    .select("*")
    .single();
  if (error) throw error;
  return data as Column;
}

export async function updateColumn(
  id: string,
  updates: Partial<Pick<Column, "name" | "wip_limit" | "order">>
): Promise<void> {
  const { error } = await supabase.from("columns").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from("columns").delete().eq("id", id);
  if (error) throw error;
}

// ─── Lanes ─────────────────────────────────────────────────

export async function getLanes(boardId: string): Promise<Lane[]> {
  const { data, error } = await supabase
    .from("lanes")
    .select("*")
    .eq("board_id", boardId)
    .order("order");
  if (error) throw error;
  return (data ?? []) as Lane[];
}

export async function createLane(
  boardId: string,
  name: string,
  color: string,
  order: number
): Promise<Lane> {
  const { data, error } = await supabase
    .from("lanes")
    .insert({ board_id: boardId, name, color, order })
    .select("*")
    .single();
  if (error) throw error;
  return data as Lane;
}

export async function updateLane(
  id: string,
  updates: Partial<Pick<Lane, "name" | "color" | "order">>
): Promise<void> {
  const { error } = await supabase.from("lanes").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteLane(id: string): Promise<void> {
  const { error } = await supabase.from("lanes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Cards ─────────────────────────────────────────────────

export async function getCards(boardId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      *,
      checklist_items (*),
      comments (*)
    `
    )
    .eq("board_id", boardId)
    .order("order");
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as Priority,
    owner_id: row.owner_id,
    column_id: row.column_id,
    lane_id: row.lane_id,
    epic_id: row.epic_id,
    feature_id: row.feature_id,
    order: row.order,
    checklist: (row.checklist_items ?? []).map((ci: any) => ({
      id: ci.id,
      text: ci.text,
      completed: ci.completed,
    })),
    comments: (row.comments ?? []).map((c: any) => ({
      id: c.id,
      text: c.text,
      author_id: c.author_id,
      created_at: c.created_at,
    })),
  }));
}

export async function createCard(params: {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: Priority;
  ownerId?: string | null;
  laneId?: string | null;
  order?: number;
}): Promise<Card> {
  const { data, error } = await supabase
    .from("cards")
    .insert({
      board_id: params.boardId,
      column_id: params.columnId,
      title: params.title,
      description: params.description ?? "",
      priority: params.priority ?? "P2",
      owner_id: params.ownerId ?? null,
      lane_id: params.laneId ?? null,
      order: params.order ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;

  return {
    ...(data as any),
    checklist: [],
    comments: [],
  } as Card;
}

export async function updateCard(
  id: string,
  updates: Partial<
    Pick<Card, "title" | "description" | "priority" | "owner_id" | "column_id" | "lane_id" | "order">
  >
): Promise<void> {
  const { error } = await supabase.from("cards").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

// ─── Checklist Items ───────────────────────────────────────

export async function addChecklistItem(
  cardId: string,
  text: string,
  order: number = 0
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ card_id: cardId, text, order })
    .select("*")
    .single();
  if (error) throw error;
  return { id: data.id, text: data.text, completed: data.completed };
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<Pick<ChecklistItem, "text" | "completed">>
): Promise<void> {
  const { error } = await supabase
    .from("checklist_items")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) throw error;
}

// ─── Comments ──────────────────────────────────────────────

export async function addComment(
  cardId: string,
  authorId: string,
  text: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ card_id: cardId, author_id: authorId, text })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    text: data.text,
    author_id: data.author_id,
    created_at: data.created_at,
  };
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

// ─── Board Members ─────────────────────────────────────────

export async function getBoardMembers(boardId: string): Promise<{ user_id: string; role: string }[]> {
  const { data, error } = await supabase
    .from("board_members")
    .select("user_id, role")
    .eq("board_id", boardId);
  if (error) throw error;
  return data ?? [];
}
