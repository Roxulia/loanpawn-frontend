import { ownershipErrorMessage } from "../errors";
import { Alert } from "../../../components/feedback";
import { Button } from "../../../components/atoms";

export function OwnershipReadError({ error, retry }: { error: unknown; retry: () => void }) {
  if (!error) return null;
  return <Alert tone="danger" title="Ownership action failed" message={ownershipErrorMessage(error)}
    action={<Button type="button" onClick={retry}>Retry</Button>} />;
}
