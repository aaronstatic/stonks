import Account from "@schema/account";
import CRUDList from "../component/CRUDList";
import Server from "../lib/Server";
import { CRUDState } from "../component/CRUD";
import Platform from "@schema/platform";
import { Form, InputPicker } from "rsuite";

interface AccountsState extends CRUDState {
    platforms: Platform[];
    selectedObject: Account | null;
}

class Accounts extends CRUDList {
    displayName = "Account";
    type = "account";

    defaultValues = {
        name: "",
        _id: "new",
        platform: "",
        currency: "USD",
        balance: 0
    } as Account;

    constructor(props: any) {
        super(props);

        this.state = {
            showPopup: false,
            selectedObject: null,
            data: [],
            platforms: [],
            filter: null
        } as AccountsState;

        Server.getAll('platform').then((platforms) => {
            if (platforms.length > 0) {
                this.defaultValues.platform = platforms[0]._id;
            }
            this.setState({ platforms } as AccountsState);
        });
    }

    onOpen = (id: string) => {
        this.openObject(id);
    }

    getName(item: Account) {
        return this.getPlatformName(item.platform) + " (" + item.currency + ")";
    }

    getPlatformName(platformId: string) {
        const { platforms } = this.state as AccountsState;
        const platform = platforms.find((p) => p._id === platformId);
        return platform?.name;
    }

    getFormData() {
        const { selectedObject } = this.state as AccountsState;
        if (!selectedObject) return null;
        selectedObject.name = this.getName(selectedObject);
        return selectedObject;
    }

    renderForm() {
        const { selectedObject, platforms } = this.state as AccountsState;
        const platformOptions = platforms.map((p) => ({ label: p.name, value: p._id }));
        return (
            <>
                <Form.Group controlId="platform">
                    <Form.ControlLabel>Platform</Form.ControlLabel>
                    <InputPicker data={platformOptions} name="platform" value={selectedObject?.platform} onChange={(v) => this.onFieldChange("platform", v)} />
                </Form.Group>
                <Form.Group controlId="currency">
                    <Form.ControlLabel>Currency</Form.ControlLabel>
                    <Form.Control name="currency" value={selectedObject?.currency} onChange={(v) => this.onFieldChange("currency", v)} />
                </Form.Group>
            </>
        );
    }

}

export default Accounts;