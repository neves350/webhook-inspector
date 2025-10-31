import { WebhookListItem } from "./webhooks-list-item";

export function WebhooksList() {
	return (
		<div className="flex-1 overflow-y-auto">
			<div className="space-y-1 p-2">
				<WebhookListItem />
				<WebhookListItem />
				<WebhookListItem />
				<WebhookListItem />
				<WebhookListItem />
			</div>
		</div>
	);
}
