import CRUDList from "../component/CRUDList";

class Strategies extends CRUDList {
    displayName = "Strategy";
    type = "strategy";
    static defaultSize = {
        width: 400,
        height: 400
    }
    onOpen = (id: string) => {
        this.openObject(id);
    }
}

export default Strategies;