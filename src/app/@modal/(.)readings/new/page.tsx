import NewReading from "@/components/NewReading";
import Modal from "@/components/Modal";

export default function NewReadingModal(props: {
  searchParams: Promise<{ meter?: string }>;
}) {
  return (
    <Modal label="Nový odečet">
      <NewReading {...props} />
    </Modal>
  );
}
