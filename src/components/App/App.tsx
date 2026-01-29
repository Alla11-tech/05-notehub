import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import css from "./App.module.css";

import SearchBox from "../SearchBox/SearchBox";
import Pagination from "../Pagination/Pagination";
import NoteList from "../NoteList/NoteList";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";

import { fetchNotes, createNote, type CreateNotePayload } from "../../services/noteService";

const PER_PAGE = 12;

export default function App() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 500);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const queryKey = useMemo(
    () => ["notes", { page, perPage: PER_PAGE, search: debouncedSearch }],
    [page, debouncedSearch]
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchNotes({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
      }),
    placeholderData: (prev) => prev,
  });

  const notes = data?.notes ?? [];
  const totalPages = data?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: (payload: CreateNotePayload) => createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setIsModalOpen(false);
      setPage(1);
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={search} onChange={handleSearchChange} />

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}

        <button className={css.button} type="button" onClick={handleOpenModal}>
          Create note +
        </button>
      </header>

      {(isLoading || isFetching) && <p>Loading...</p>}

      {isError && (
        <p>
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {!isLoading && notes.length > 0 && <NoteList notes={notes} />}

      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <NoteForm
            onCancel={handleCloseModal}
            onSubmit={(values) => createMutation.mutate(values)}
            isSubmitting={createMutation.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
