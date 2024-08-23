import Account from "@schema/account";
import Trade from "@schema/trade";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { DatePicker, Form, InputNumber, InputPicker, Loader, Button, HStack } from "rsuite";
import Server from "../lib/Server";
import Option from "@schema/option";

type AddTradeProps = {
    onAdd: () => void;
    onCancel: () => void;
}

export default function AddTrade({ onAdd, onCancel }: AddTradeProps) {
    const [error, setError] = useState<string>("");
    const [tickerName, setTickerName] = useState<string>("");
    const [trade, setTrade] = useState<Trade>({
        _id: "new",
        type: "BUY",
        account: "",
        quantity: 1,
        timestamp: DateTime.now().toISO(),
        price: 0,
        fees: 0,
        holding: "",
        transaction: "",
        qtyFees: 0,
        balance: 0,
        owner: "",
        name: "",
        holdingType: "Stock"
    });
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account>({
        _id: "",
        name: "",
        currency: "USD",
        platform: "",
        balance: 0,
        owner: ""
    });
    const [tradeType, setTradeType] = useState("Stock");
    const [option, setOption] = useState<Option>({
        _id: "new",
        type: "Call",
        strike: 0,
        expiry: DateTime.now().plus({ days: 40 }).toISO(),
        holding: "",
        name: "",
        owner: ""
    });
    const [ticker, _setTicker] = useState<string>("");
    const setTicker = (v: string) => {
        v = v.toUpperCase();
        _setTicker(v);
    }

    const onTickerBlur = () => {
        let v = ticker;
        if (tradeType == "Option" && v.indexOf(" ") > -1) {
            const match = /^([A-Z]+)\s([0-9]+)([CP])\s([0-9]+)\s([A-Za-z]+)$/.exec(v);

            if (match) {
                let expiry = DateTime.fromFormat(match[4] + match[5], "ddMMM");
                if (expiry < DateTime.now()) {
                    expiry = expiry.plus({ years: 1 });
                }
                setOption({
                    ...option,
                    type: match[3] == "C" ? "Call" : "Put",
                    strike: parseFloat(match[2]),
                    expiry: expiry.toISO() || ""
                });
                v = match[1];
                setTicker(v);
            }
            setTickerName("");
        }
        if (tradeType == "Stock") {
            Server.getStockPrice(v).then((price) => {
                if (price > 0) {
                    onFieldChange("price", price);
                }
            });
            Server.getStockName(v).then((name) => {
                setTickerName(name);
            });
        }
        if (tradeType == "Crypto") {
            Server.getCryptoPrice(v).then((price) => {
                if (price > 0) {
                    onFieldChange("price", price);
                }
            });
            setTickerName("");
        }
    }

    if (!accounts) return <Loader center />;

    useEffect(() => {
        Server.getAll('account').then((accounts) => {
            if (trade.account == "" && accounts.length > 0) {
                onFieldChange("account", accounts[0]._id);
            } else if (accounts.length == 0) {
                setError("You must first create a platform and account");
                return;
            }
            setAccounts(accounts as Account[]);
        });
    }, []);

    const onFieldChange = (field: string, value: any) => {
        if (field == "account") {
            const account = accounts.find((a) => a._id == value);
            if (account)
                setSelectedAccount(account);
        }
        setTrade({ ...trade, [field]: value });
    }

    const onOptionChange = (field: string, value: any) => {
        setOption({ ...option, [field]: value });
    }

    const save = () => {
        trade.price = parseFloat(trade.price.toString());
        trade.quantity = parseFloat(trade.quantity.toString());
        trade.fees = parseFloat(trade.fees.toString());
        if (tradeType == "Option") {
            option.strike = parseFloat(option.strike.toString());
        }
        Server.addTrade(ticker, tradeType, trade, option).then(() => {

        });
        onAdd();
    }

    if (error) return <div>{error}</div>;

    return <Form style={{ padding: 10 }}>
        <h3>Add Trade</h3>
        <Form.Group controlId="timestamp">
            <Form.ControlLabel>Type</Form.ControlLabel>
            <InputPicker
                cleanable={false}
                name="type"
                data={[
                    { label: "Stock", value: "Stock" },
                    { label: "Crypto", value: "Crypto" },
                    { label: "Option", value: "Option" }
                ]}
                value={tradeType}
                onChange={(v) => {
                    setTradeType(v);
                    setTickerName("");
                    onFieldChange("price", 0);
                    setTicker("");
                }}
            />
        </Form.Group>
        <Form.Group controlId="ticker">
            <Form.ControlLabel>Ticker</Form.ControlLabel>
            <Form.Control
                style={{ width: "120px", marginRight: "10px" }}
                name="ticker"
                value={ticker}
                onChange={setTicker}
                onBlur={onTickerBlur}
            />
            {tickerName}
        </Form.Group>
        {tradeType == "Option" && (<>
            <Form.Group controlId="strike">
                <Form.ControlLabel>Strike</Form.ControlLabel>
                <InputNumber
                    name="strike"
                    value={option.strike}
                    min={0}
                    onChange={(v) => {
                        onOptionChange("strike", v);
                    }}
                />
            </Form.Group>
            <Form.Group controlId="type">
                <Form.ControlLabel>Option Type</Form.ControlLabel>
                <InputPicker
                    cleanable={false}
                    name="type"
                    data={[
                        { label: "Call", value: "Call" },
                        { label: "Put", value: "Put" }
                    ]}
                    value={option?.type}
                    onChange={(v) => {
                        onOptionChange("type", v);
                    }}
                />
            </Form.Group>
            <Form.Group controlId="expiry">
                <Form.ControlLabel>Expiry</Form.ControlLabel>
                <DatePicker
                    format="dd/MM/yyyy"
                    name="expiry"
                    value={DateTime.fromISO(option.expiry).toJSDate()}
                    onChange={v => {
                        if (v instanceof Date)
                            onOptionChange("expiry", DateTime.fromJSDate(v).toISO());
                    }}
                />
            </Form.Group>
        </>)}
        <Form.Group controlId="timestamp">
            <Form.ControlLabel>Trade Time</Form.ControlLabel>
            <DatePicker
                format="dd/MM/yyyy HH:mm"
                name="timestamp"
                value={DateTime.fromISO(trade?.timestamp).toJSDate()}
                onChange={v => {
                    if (v instanceof Date)
                        onFieldChange("timestamp", DateTime.fromJSDate(v).toISO());
                }}
            />
        </Form.Group>
        <Form.Group controlId="timestamp">
            <Form.ControlLabel>Side</Form.ControlLabel>
            <InputPicker
                cleanable={false}
                name="type"
                data={[
                    { label: "BUY", value: "BUY" },
                    { label: "SELL", value: "SELL" }
                ]}
                value={trade?.type}
                onChange={(v) => {
                    onFieldChange("type", v);
                }}
            />
        </Form.Group>
        <Form.Group controlId="account">
            <Form.ControlLabel>Account</Form.ControlLabel>
            <InputPicker
                name="account"
                cleanable={false}
                data={accounts.map((a) => ({ label: a.name, value: a._id }))}
                value={trade?.account}
                onChange={(v) => {
                    onFieldChange("account", v);
                }}
            />
        </Form.Group>
        <Form.Group controlId="amount">
            <Form.ControlLabel>Quantity</Form.ControlLabel>
            <InputNumber
                name="quantity"
                min={0}
                value={trade?.quantity}
                onChange={(v) => {
                    onFieldChange("quantity", v);
                }}
            />
        </Form.Group>
        <Form.Group controlId="price">
            <Form.ControlLabel>Price</Form.ControlLabel>
            <InputNumber
                name="price"
                value={trade?.price}
                min={0}
                formatter={v => {
                    return `${v} ${selectedAccount?.currency || "USD"}`;
                }}
                onChange={(v) => {
                    onFieldChange("price", v);
                }}
            />
        </Form.Group>
        <Form.Group controlId="fees">
            <Form.ControlLabel>Fees</Form.ControlLabel>
            <InputNumber
                name="fees"
                value={trade?.fees}
                min={0}
                formatter={v => {
                    return `${v} ${selectedAccount?.currency || "USD"}`;
                }}
                onChange={(v) => {
                    onFieldChange("fees", v);
                }}
            />
        </Form.Group>

        <br />
        <HStack>
            <Button size="md" onClick={save} appearance="primary">OK</Button>
            <Button size="md" onClick={onCancel} appearance="default">Cancel</Button>
        </HStack>
    </Form>
}