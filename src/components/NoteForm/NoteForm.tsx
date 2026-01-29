import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import css from "./NoteForm.module.css";
import type { NoteTag } from "../../types/note";
import { createNote, type CreateNotePayload } from "../../services/noteService";

interface NoteFormProps {
  onCancel: () => void;
}

const tags: NoteTag[] = ["Todo", "Work", "Personal", "Meeting", "Shopping"];

const schema = Yup.object({
  title: Yup.string().min(3, "Min 3 characters").max(50, "Max 50 characters").required("Required"),
  content: Yup.string().max(500, "Max 500 characters"),
  tag: Yup.mixed<NoteTag>().oneOf(tags).required("Required"),
});

export default function NoteForm({ onCancel }: NoteFormProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateNotePayload) => createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      onCancel(); // закриваємо модалку після успіху
    },
  });

  const initialValues: CreateNotePayload = {
    title: "",
    content: "",
    tag: "Todo",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values, actions) => {
        mutate(values, {
          onSuccess: () => {
            actions.resetForm();
          },
        });
      }}
    >
      {() => (
        <Form className={css.form}>
          <div className={css.formGroup}>
            <label htmlFor="title">Title</label>
            <Field id="title" type="text" name="title" className={css.input} />
            <ErrorMessage name="title">
              {(msg) => <span className={css.error}>{msg}</span>}
            </ErrorMessage>
          </div>

          <div className={css.formGroup}>
            <label htmlFor="content">Content</label>
            <Field as="textarea" id="content" name="content" rows={8} className={css.textarea} />
            <ErrorMessage name="content">
              {(msg) => <span className={css.error}>{msg}</span>}
            </ErrorMessage>
          </div>

          <div className={css.formGroup}>
            <label htmlFor="tag">Tag</label>
            <Field as="select" id="tag" name="tag" className={css.select}>
              {tags.map((t) => (
                <option value={t} key={t}>
                  {t}
                </option>
              ))}
            </Field>
            <ErrorMessage name="tag">
              {(msg) => <span className={css.error}>{msg}</span>}
            </ErrorMessage>
          </div>

          <div className={css.actions}>
            <button type="button" className={css.cancelButton} onClick={onCancel}>
              Cancel
            </button>

            <button type="submit" className={css.submitButton} disabled={isPending}>
              Create note
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
