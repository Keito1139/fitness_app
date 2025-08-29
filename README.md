## Windows と Mac での仮想環境への入り方

### Windows の場合

#### 仮想環境の有効化

作成した仮想環境を有効化するには、以下のコマンドを実行してください。

```bash
.venv\Scripts\activate.ps1
```

#### 仮想環境の無効化

仮想環境を無効化するには、以下のコマンドを実行してください。

```bash
deactivate
```

---

### Mac の場合

#### 仮想環境の有効化

作成した仮想環境を有効化するには、以下のコマンドを実行してください。

```bash
source .venv/bin/activate
```

#### 仮想環境の無効化

仮想環境を無効化するには、以下のコマンドを実行してください。

```bash
deactivate
```

---

## 各ディレクトリで必要なライブラリのインストール方法

### バックエンド (Django) のライブラリインストール

Django の依存関係は `backend/requirements.txt` に記載されています。
仮想環境に入り、以下のコマンドで必要なライブラリをインストールしてください。

```bash
pip install -r backend/requirements.txt
```

### フロントエンド (React) のライブラリインストール

React プロジェクトの依存関係をインストールするには、以下のコマンドを実行してください。

```bash
cd frontend
npm install
```

### モバイルアプリ (React Native) のライブラリインストール

モバイルアプリは `student`, `teacher`, `parent` の 3 つのディレクトリに分かれています。
各ディレクトリごとに以下のコマンドを実行してください。

#### 生徒向けアプリ (`/mobile/student/`)

```bash
cd mobile/student
npm install
```

#### 教師向けアプリ (`/mobile/teacher/`)

```bash
cd mobile/teacher
npm install
```

#### 保護者向けアプリ (`/mobile/parent/`)

```bash
cd mobile/parent
npm install
```

---

## プロジェクトの準備方法

このプロジェクトをセットアップするためには、以下の手順を実行してください。

### マイグレーションの作成

まず、データベースのマイグレーションを作成します。

```bash
python manage.py makemigrations
```

### マイグレーションの適用

次に、作成したマイグレーションをデータベースに適用します。

```bash
python manage.py migrate
```

### セットアップの実行

最後に、プロジェクトのセットアップを行います。

```bash
python manage.py setup
```

### requirements.txt への反映コマンド

```bash
pip freeze > requirements.txt
```

# fitness_app

# バックエンドでアプリを作るとき

python manage.py startapp ~
