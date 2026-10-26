import EditTariff from "@/components/EditTariff";
import Modal from "@/components/Modal";
import TariffsPage from "@/app/tariffs/page";

export const dynamic = "force-dynamic";

export default function EditTariffPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <TariffsPage />
      <Modal label="Upravit sazbu" returnTo="/tariffs">
        <EditTariff {...props} />
      </Modal>
    </>
  );
}
