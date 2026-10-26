import EditReading from "@/components/EditReading";
import ReadingModal from "@/components/ReadingModal";
import ReadingsPage from "@/app/readings/page";

export const dynamic = "force-dynamic";

export default function EditReadingPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <ReadingsPage searchParams={Promise.resolve({})} />
      <ReadingModal label="Upravit odečet" returnTo="/readings">
        <EditReading {...props} />
      </ReadingModal>
    </>
  );
}
