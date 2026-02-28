# フォルダ構成

- フォルダ構成は以下の通り

```
.
└── app
    ├── bin
    │   └── app.ts            CDK App定義ファイル
    ├── lib
    │   ├── construct         コンストラクト
    │   │   ├── nfw.ts          Network Firewall
    │   │   ├── tgw_rtb.ts      Transit Gateway RouteTable
    │   │   ├── tgw.ts          Transit Gateway
    │   │   └── vpc.ts          VPC
    │   └── stack
    │       └── app-stack.ts  スタック
    └── parameter.ts          設定値定義ファイル
```
