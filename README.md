# group tab component

> react group tabs component with tailwindcss

### Installation

```js
pnpm add react-group-tabs
```

### Demo

react group tabs component [Demo](https://group-tabs.vercel.app/)

https://github.com/user-attachments/assets/c57491c6-df83-4a75-9520-e8afe8cd583f

### Usage

```jsx
import Board from "react-group-tabs";

const data = {
  group: {
    "7528bb2e-8513-440c-8672-1e6535cbe439": {
      id: "7528bb2e-8513-440c-8672-1e6535cbe439",
      tabIds: ["eb7c60bd-5cf5-4872-9997-61c717b0f0c0", "b8f3ed8f-61a3-4017-8415-63c624719b1a", "afa61212-fd95-447a-b1a9-22e4ce3c142e"],
      selectedTabId: "eb7c60bd-5cf5-4872-9997-61c717b0f0c0",
      size: {
        width: 400,
        height: 300,
      },
      prevSize: {
        width: 400,
        height: 300,
      },
      position: {
        x: 0,
        y: 0,
      },
      prevPosition: {
        x: 0,
        y: 0,
      },
    },
  },
  tab: {
    "eb7c60bd-5cf5-4872-9997-61c717b0f0c0": {
      id: "eb7c60bd-5cf5-4872-9997-61c717b0f0c0",
      groupId: "7528bb2e-8513-440c-8672-1e6535cbe439",
      name: "tab1",
      content: "tab1 content",
    },
    "b8f3ed8f-61a3-4017-8415-63c624719b1a": {
      id: "b8f3ed8f-61a3-4017-8415-63c624719b1a",
      groupId: "7528bb2e-8513-440c-8672-1e6535cbe439",
      name: "tab2",
      content: "tab2 content",
    },
    "afa61212-fd95-447a-b1a9-22e4ce3c142e": {
      id: "afa61212-fd95-447a-b1a9-22e4ce3c142e",
      groupId: "7528bb2e-8513-440c-8672-1e6535cbe439",
      name: "tab3",
      content: "tab3 content",
    },
  },
};

const MyComponent = () => {
  return (
    <Board.Provider data={data}>
      <Board.Container>
        <Board.Groups />
      </Board.Container>
    </Board.Provider>
  );
};
```

##### tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./node_modules/react-group-tabs/**/**.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```
