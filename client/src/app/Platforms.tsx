import CRUDList from "../component/CRUDList";

class Platforms extends CRUDList {
    displayName = "Platform";
    type = "platform";
    static defaultSize = {
        width: 400,
        height: 400
    }
    showOpenButton = false;
}

export default Platforms;