"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Board, Column, Card, Lane, User } from "./types";
import * as api from "./api";

type BoardContextState = {
  // Current user
  currentUser: User | null;
  // Data
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  cards: Card[];
  lanes: Lane[];
  users: User[];
  // Loading
  loading: boolean;
  // Actions
  selectBoard: (board: Board) => void;
  createBoard: (name: string) => Promise<Board | null>;
  refreshBoard: () => Promise<void>;
  moveCard: (cardId: string, newColumnId: string, newLaneId: string | null) => Promise<void>;
};

const BoardContext = createContext<BoardContextState | undefined>(undefined);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Init: fetch user + boards
  useEffect(() => {
    async function init() {
      try {
        const [user, boardList, userList] = await Promise.all([
          api.getCurrentUser(),
          api.getBoards(),
          api.getUsers(),
        ]);
        setCurrentUser(user);
        setBoards(boardList);
        setUsers(userList);
        if (boardList.length > 0) {
          setCurrentBoard(boardList[0]);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load board data when currentBoard changes
  const refreshBoard = useCallback(async () => {
    if (!currentBoard) {
      setColumns([]);
      setCards([]);
      setLanes([]);
      return;
    }
    try {
      const [cols, cds, lns] = await Promise.all([
        api.getColumns(currentBoard.id),
        api.getCards(currentBoard.id),
        api.getLanes(currentBoard.id),
      ]);
      setColumns(cols);
      setCards(cds);
      setLanes(lns);
    } catch (e) {
      console.error("Load board error:", e);
    }
  }, [currentBoard]);

  useEffect(() => {
    refreshBoard();
  }, [refreshBoard]);

  const selectBoard = (board: Board) => setCurrentBoard(board);

  const createBoardAction = async (name: string): Promise<Board | null> => {
    if (!currentUser) return null;
    const board = await api.createBoard(name, currentUser.id);
    setBoards((prev) => [...prev, board]);
    setCurrentBoard(board);
    return board;
  };

  const moveCard = async (
    cardId: string,
    newColumnId: string,
    newLaneId: string | null
  ) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, column_id: newColumnId, lane_id: newLaneId } : c
      )
    );
    try {
      await api.updateCard(cardId, { column_id: newColumnId, lane_id: newLaneId });
    } catch (e) {
      console.error("Move card error:", e);
      refreshBoard(); // rollback
    }
  };

  return (
    <BoardContext.Provider
      value={{
        currentUser,
        boards,
        currentBoard,
        columns,
        cards,
        lanes,
        users,
        loading,
        selectBoard,
        createBoard: createBoardAction,
        refreshBoard,
        moveCard,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoardContext must be used within BoardProvider");
  return ctx;
}
