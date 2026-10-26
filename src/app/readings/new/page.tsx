import NewReading from "@/components/NewReading";
import Modal from "@/components/Modal";
import ReadingsPage from "@/app/readings/page";
import { readingsListUrl } from "@/lib/filters";

export const dynamic = "force-dynamic";

export default async function NewReadingPage(props: {
  searchParams: Promise<{ meter?: string }>;
}) {
  const { meter } = await props.searchParams;
  return (
    <>
      <ReadingsPage searchParams={props.searchParams} />
      <Modal label="Nový odečet" returnTo={readingsListUrl(meter)}>
        <NewReading {...props} />
      </Modal>
    </>
  );
}
