import EditReading from "@/components/EditReading";
import Modal from "@/components/Modal";

export default function EditReadingModal(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ meter?: string }>;
}) {
  return (
    <Modal label="Upravit odečet">
      <EditReading {...props} />
    </Modal>
  );
}
