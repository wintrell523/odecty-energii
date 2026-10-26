import Modal from "@/components/Modal";
import NewMeter from "@/components/NewMeter";
import MetersPage from "@/app/meters/page";

export const dynamic = "force-dynamic";

export default function NewMeterPage() {
  return (
    <>
      <MetersPage />
      <Modal label="Nový měřič" returnTo="/meters">
        <NewMeter />
      </Modal>
    </>
  );
}
