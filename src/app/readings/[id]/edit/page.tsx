import EditReading from "@/components/EditReading";
import Modal from "@/components/Modal";
import ReadingsPage from "@/app/readings/page";

export const dynamic = "force-dynamic";

export default function EditReadingPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <ReadingsPage searchParams={Promise.resolve({})} />
      <Modal label="Upravit odečet" returnTo="/readings">
        <EditReading {...props} />
      </Modal>
    </>
  );
}
