import NewReading from "@/components/NewReading";
import ReadingModal from "@/components/ReadingModal";
import ReadingsPage from "@/app/readings/page";

export const dynamic = "force-dynamic";

export default function NewReadingPage(props: {
  searchParams: Promise<{ meter?: string }>;
}) {
  return (
    <>
      <ReadingsPage searchParams={Promise.resolve({})} />
      <ReadingModal returnTo="/readings">
        <NewReading {...props} />
      </ReadingModal>
    </>
  );
}
