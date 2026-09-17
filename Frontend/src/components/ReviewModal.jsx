import { useState } from "react";
import apiClient from "../api/client";
import Modal from "./Modal";

const MAX_COMMENT = 500;

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        role="radio"
        aria-checked={value === star}
        aria-label={`${star} star${star > 1 ? "s" : ""}`}
        onClick={() => onChange(star)}
        className="text-3xl leading-none cursor-pointer"
      >
        <span className={star <= value ? "text-amber-500" : "text-slate-300"}>★</span>
      </button>
    ))}
  </div>
);

/**
 * Review dialog for a completed session. Mount it only while open so every
 * review starts blank. `onClose(result)` receives `{ submitted: true }` when
 * a review was sent, so the parent can drop it from the "pending" list.
 */
const ReviewModal = ({ sessionId, partnerName, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const name = partnerName || "your partner";

  const handleClose = () => onClose({ submitted });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating) return;

    setErrorMsg("");
    setSubmitting(true);

    try {
      await apiClient.post("/reviews", {
        session: sessionId,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Couldn't submit the review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Modal title="Review sent" onClose={handleClose}>
        <p className="text-sm text-slate-600 m-0">
          Thanks for rating your session with {name}.
        </p>
        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Rate your session with ${name}`} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="text-xs font-medium text-slate-600">
          How was it?
          <div className="mt-1">
            <StarPicker value={rating} onChange={setRating} />
          </div>
        </div>

        <label className="text-xs font-medium text-slate-600">
          Comment <span className="font-normal text-slate-400">(optional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT}
            rows={4}
            placeholder="How did the session go?"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <span className="block text-right text-[11px] text-slate-400 tabular-nums">
            {comment.length}/{MAX_COMMENT}
          </span>
        </label>

        {errorMsg && (
          <p role="alert" className="text-sm text-red-600 m-0">
            {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !rating}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;
