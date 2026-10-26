import NewReading from "@/components/NewReading";
import ReadingModal from "@/components/ReadingModal";

export default function NewReadingModal(props: {
  searchParams: Promise<{ meter?: string }>;
}) {
  return (
    <ReadingModal>
      <NewReading {...props} closeOnSuccess />
    </ReadingModal>
  );
}
