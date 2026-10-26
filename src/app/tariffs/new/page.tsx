import Modal from "@/components/Modal";
import NewTariff from "@/components/NewTariff";
import TariffsPage from "@/app/tariffs/page";

export const dynamic = "force-dynamic";

export default function NewTariffPage() {
  return (
    <>
      <TariffsPage />
      <Modal label="Nová sazba" returnTo="/tariffs">
        <NewTariff />
      </Modal>
    </>
  );
}
