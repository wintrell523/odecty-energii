import NewReading from "@/components/NewReading";
import Modal from "@/components/Modal";
import ReadingsPage from "@/app/readings/page";

export const dynamic = "force-dynamic";

export default function NewReadingPage(props: {
  searchParams: Promise<{ meter?: string }>;
}) {
  return (
    <>
      <ReadingsPage searchParams={Promise.resolve({})} />
      <Modal label="Nový odečet" returnTo="/readings">
        <NewReading {...props} />
      </Modal>
    </>
  );
}
