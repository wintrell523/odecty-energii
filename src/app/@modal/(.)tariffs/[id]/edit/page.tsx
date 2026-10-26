import EditTariff from "@/components/EditTariff";
import Modal from "@/components/Modal";

export default function EditTariffModal(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Modal label="Upravit sazbu">
      <EditTariff {...props} />
    </Modal>
  );
}
