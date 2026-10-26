import EditReading from "@/components/EditReading";
import ReadingModal from "@/components/ReadingModal";

export default function EditReadingModal(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ReadingModal label="Upravit odečet">
      <EditReading {...props} closeOnSuccess />
    </ReadingModal>
  );
}
