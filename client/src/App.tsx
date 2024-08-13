import './App.css'
import Window from './component/desktop/Window'
import React, { createContext } from 'react'
import Platforms from './app/Platforms'
import Server from './lib/Server'
import Accounts from './app/Accounts'
import { Container, Content, Loader, Sidebar } from 'rsuite'
import Menu from './component/desktop/Menu'
import styled from 'styled-components'
import Account from './app/Account'
import Holdings from './app/Holdings'
import Holding from './app/Holding'
import Dashboard from './report/Dashboard'
import Option from './app/Option'
import AddTrade from './app/AddTrade'
import Watchlist from './app/Watchlist'
import WatchlistItemReport from './app/WatchlistItem'
import Index from './report/Index'

type WindowData = {
  id: string;
  zIndex: number;
  type: string;
  subType?: string;
}

type WindowAPI = {
  openWindow: (type: string, id?: string) => void;
  closeWindow: (id: string) => void;
  windows: { [id: string]: WindowData };
}

type ApplicationMap = {
  [id: string]: React.ComponentType;
}

type TypeMap = {
  [id: string]: string;
}

type SizeMap = {
  [id: string]: { width: number, height: number };
}

const Applications: ApplicationMap = {
  Platforms,
  Accounts,
  Account,
  Holdings,
  Holding,
  Option,
  AddTrade,
  Watchlist,
  WatchlistItemReport,
  Index
}

const TypeApplications: TypeMap = {
  "account": "Account",
  "holding": "Holding",
  "option": "Option",
  "watchlist": "WatchlistItemReport",
  "index": "Index"
}

const DefaultSizes: SizeMap = {
  "Account": {
    width: 600,
    height: 500
  },
  "Holding": {
    width: 930,
    height: 730
  },
  "Index": {
    width: 930,
    height: 670
  },
  "WatchlistItemReport": {
    width: 930,
    height: 730
  },
  "Option": {
    width: 930,
    height: 570
  },
  "AddTrade": {
    width: 1000,
    height: 650
  }
}

export type MenuItem = {
  id: string;
  title: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  {
    id: "Platforms",
    title: "Platforms",
    icon: "smartphone"
  },
  {
    id: "Accounts",
    title: "Accounts",
    icon: "attach_money"
  },
  {
    id: "Holdings",
    title: "Holdings",
    icon: "account_balance"
  },
  {
    id: "AddTrade",
    title: "Add Trade",
    icon: "add_shopping_cart"
  },
  {
    id: "Watchlist",
    title: "Watchlist",
    icon: "trending_up"
  }
]

const MenuWrap = styled(Sidebar)`
  background-color: var(--rs-gray-800);
  height: 100vh;
`

const defaultWindows: { [id: string]: WindowData } = {};

export const Windows = createContext<WindowAPI>({
  openWindow: () => { },
  closeWindow: () => { },
  windows: defaultWindows
});
export const ItemData = createContext<WindowData | null>(null);

export const UserData = createContext<{
  id: string;
  currency: string;
} | null>(null);

type AppState = {
  windows: { [id: string]: WindowData };
  userData: {
    id: string;
    currency: string;
  } | null;
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      windows: defaultWindows,
      userData: null
    };
  }

  componentDidMount(): void {

    const redirectLogin = () => {
      const baseurl = window.location.origin;
      const encodedUrl = encodeURIComponent(baseurl + "/auth/discord");
      document.location.href = "https://discord.com/oauth2/authorize?client_id=1242716411923529781&response_type=code&redirect_uri=" + encodedUrl + "&scope=identify+guilds";
    }

    Server.init();
    Server.on("open-object", (data: any) => {
      const type = TypeApplications[data.type];
      this.openWindow(type, data.id, data.subType);
    });
    //check cookie for session Id

    function getCookie(name: string) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    }

    const sessionId = getCookie("sessionId");

    if (sessionId) {
      Server.getSession(sessionId).then((data) => {
        console.log(data);
        if (!data.userData || data.userData.id == "") {
          redirectLogin();
          return;
        }

        this.setState({
          userData: data.userData
        });
      });
    } else {
      redirectLogin();
    }
  }

  openWindow = (type: string, id: string = "", subType: string = ""): void => {
    const { windows } = this.state;
    if (id === "") {
      id = "win-" + Math.random().toString(16).slice(2);
    }
    if (windows[id]) {
      return;
    }
    this.setState({
      windows: {
        ...windows,
        [id]: {
          id,
          zIndex: 0,
          type,
          subType
        }
      }
    });
  }

  closeWindow = (id: string): void => {
    const { windows } = this.state;
    const newWindows = { ...windows };
    delete newWindows[id];
    this.setState({ windows: newWindows });
  }

  render() {
    const { windows, userData } = this.state;

    if (!userData) {
      return <Loader size="lg" center />
    }

    return (
      <UserData.Provider value={userData}>
        <Windows.Provider value={{
          openWindow: this.openWindow,
          closeWindow: this.closeWindow,
          windows
        }}>
          <Container>
            <MenuWrap>
              <Menu items={menuItems} onClick={this.openWindow} />
            </MenuWrap>
            <Content>
              <Dashboard />
              {Object.keys(windows).map((id) => {
                const win = windows[id];
                const App = Applications[win.type];
                const defaultSize = {
                  width: 400,
                  height: 300
                }
                if (win.type in DefaultSizes) {
                  defaultSize.width = DefaultSizes[win.type].width;
                  defaultSize.height = DefaultSizes[win.type].height;
                }
                return (
                  <Window defaultSize={defaultSize} key={id} title={win.type} windowId={id} >
                    <ItemData.Provider value={win}>
                      <App />
                    </ItemData.Provider>
                  </Window>
                )
              })}
            </Content>
          </Container>
        </Windows.Provider>
      </UserData.Provider>
    )
  }
}
export default App;
