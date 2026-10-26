import EditMeter from "@/components/EditMeter";
import Modal from "@/components/Modal";

export default function EditMeterModal(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Modal label="Upravit měřič">
      <EditMeter {...props} />
    </Modal>
  );
}
