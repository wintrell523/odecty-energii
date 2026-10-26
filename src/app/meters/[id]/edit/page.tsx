import EditMeter from "@/components/EditMeter";
import Modal from "@/components/Modal";
import MetersPage from "@/app/meters/page";

export const dynamic = "force-dynamic";

export default function EditMeterPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <MetersPage />
      <Modal label="Upravit měřič" returnTo="/meters">
        <EditMeter {...props} />
      </Modal>
    </>
  );
}
