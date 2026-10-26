import EditReading from "@/components/EditReading";
import Modal from "@/components/Modal";
import ReadingsPage from "@/app/readings/page";
import { readingsListUrl } from "@/lib/filters";

export const dynamic = "force-dynamic";

export default async function EditReadingPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ meter?: string }>;
}) {
  const { meter } = await props.searchParams;
  return (
    <>
      <ReadingsPage searchParams={props.searchParams} />
      <Modal label="Upravit odečet" returnTo={readingsListUrl(meter)}>
        <EditReading {...props} />
      </Modal>
    </>
  );
}
