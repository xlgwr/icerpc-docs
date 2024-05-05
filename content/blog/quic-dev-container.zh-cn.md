# 使用 Dev Containers 进行 .NET QUIC 精简开发

> 主要是引导大家，如何使用开发容器`Development Containers`，进行.Net下的QUIC的开发。

QUIC 是一种考虑到性能和安全性的现代传输协议,是**远程过程调用（RPCs）的理想选择**。 然而，利用 QUIC 功能开发 .NET 应用程序，可能具有挑战性，因为.NET 对跨平台 QUIC 的支持有限。例如：.NET QUIC 实现需要 Linux 上的 `libmsquic` 库，并且截至撰写本文时还未支持 Windows 10 或 macOS。因此，深入研究基于 QUIC 的应用程序开发的最有效方法之一是**利用开发容器development containers**。

> **开发容器**(简称dev container) 允许将容器作为功能齐全的开发环境。它可用于运行应用程序、分离使用代码库所需的工具、库或运行时,并帮助持续集成和测试。</br>
https://containers.dev

这些容器能够创建便携式、一致的开发环境 - 解决 QUIC 开发.NET相关的特定平台的挑战，并确保团队中的所有开发人员都在使用相同的工具和库。

本篇将引导设置，专门用于开发的开发容器 .NET 应用程序，应用程序使用 QUIC，然后说明，如何使用此容器运行简单的 QUIC 服务器和客户端。然而,涉及开发容器的整体概念，可以应用于任何应用！

## 先决条件

### Docker

Docker 是一个用于构建和共享容器化应用程序的工具。 Docker 开始使用的最佳方法是在电脑机器上安装 [Docker Desktop].

装 Docker Desktop 后,启动它并确保其运行。可以通过在终端中执行以下命令来验证 Docker 是否正确安装以及 Docker 守护程序是否正在运行:

``` bash
docker info
```

### Visual Studio Code

虽然可以使用任何支持 dev 容器的编辑器,但本篇将假设正在使用 Visual Studio Code（VS Code）。 因此,请确保您已下载 VS Code 并安装了 Dev Containers 扩展：

* [VS Code]
* [Dev Containers]

## 1. 创建 `.devcontainer` 目录

既然我们已经安装并运行了 Docker,我们可以开始配置我们的开发环境。创建新目录或导航到要设置开发容器的现有项目。

导航到项目并创建一个顶级目录,可以在其中存储开发环境配置文件和代码。

```bash
mkdir .devcontainer
cd .devcontainer
```

## 2. 创建 `devcontainer.json`

在 `.devcontainer` 文件夹中创建 `devcontainer.json` 文件。该文件将定义开发环境的配置。虽然可以使用 `devcontainer.json` 文件来指定各种设置，但我们只会指示它使用我们将在下一步中创建的 `Dockerfile` ，并指定一些运行参数。可以在[Dev Container specification]中找到其他配置选项。

```json
{
    "name": "QUIC Development Container",
    "build": {
        "dockerfile": "Dockerfile"
    }
}
```

**这个 devcontainer.json 做了什么？**

* 名称 `name` 属性指定开发容器的名称。当开发容器处于活动状态时,该名称会显示在 VS 代码状态栏中。
* 构建 `build` 属性指定将用于构建开发容器的 `Dockerfile` 路径。在这种情况下,`Dockerfile` 与 `devcontainer.json` 文件位于同一目录中,并命名为`Dockerfile`。

## 3. 创建 Dockerfile
下一步, 在 `.devcontainer` 目录下创建 Dockerfile 文件。 该文件包含构建 Docker 映像的说明,这是开发容器的基础。

```Dockerfile
FROM mcr.microsoft.com/devcontainers/dotnet:8.0-jammy

# Install libmsquic
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt install libmsquic -y
```

### 这个 Dockerfile 做了什么？

* `mcr.microsoft.com/devcontainers/dotnet:8.0-jammy` 指定开发容器的基本映像。这是一个包含 .NET SDK 和运行时，以及所需的其他工具和库 .NET 开发的 Linux 映像。
* `libmsquic` Linux 平台上的 .NET QUIC 库。可以在[QUIC in .NET]中了解有关 QUIC 的更多信息.

## 4. QUIC 和 证书

由于 QUIC 是一种安全的运输工具,因此需要提供证书。为了简单起见,在本篇中,我们将在下一节中使用 IceRPC 新建项目模板提供的证书。请注意，这些***证书不适合生产***使用，在部署应用程序时应替换为自己的证书。

## 5. 使用 Dev Container

为了使用 QUIC 开发容器, 我们使用 `icerpc-slice-*` .NET 模板，来生成一个通过 QUIC 进行通信的服务端和一个客户端。还为我们处理 SSL 证书，是快速验证开发容器的绝佳起点。

```bash
dotnet new install IceRPC.Templates
dotnet new icerpc-slice-client -o ExampleClient --transport quic
dotnet new icerpc-slice-server -o ExampleServer --transport quic
```

现在我们已经创建了服务器和客户端,我们可以在 VS Code 中打开我们的项目,并使用 `Ctrl+Shift+P` 或 `Cmd+Shift+P` 启动命令板,然后搜索 Dev Container:在 Container 中打开文件夹`Open Folder in Container`并选择根级项目目录。 

这将打开一个新的 VS Code 窗口，等待容器下载及更新，项目将加载到开发容器中！

![Command Palette in VS Code](https://zeroc.com/_next/image?url=%2Fblogs%2Fquic-dev-container%2Fcommand-palette.png&w=1080&q=75)

现在我们的项目在开发容器中打开,可以启动服务器和客户端。可以通过在 VS Code 集成终端中运行服务器和客户端来完成此操作,该终端现在将使用开发容器。

![VS Code window with active dev container](https://zeroc.com/_next/image?url=%2Fblogs%2Fquic-dev-container%2Factive-container.png&w=1080&q=75)

`IceRPC` 客户端和服务器, 运行非常简单：

```bash
cd ExampleServer
dotnet run

# In a new terminal tab
cd ExampleClient
dotnet run
```

### **来，看看效果吧**

* 服务端
![image](https://img2024.cnblogs.com/blog/127234/202405/127234-20240503111347390-221813120.png)
* 客户端
![image](https://img2024.cnblogs.com/blog/127234/202405/127234-20240503111223459-133595402.png)

## 结论

现在应该可以看到客户端和服务器通过 QUIC 进行通信！好吧，我们可以在开发容器内开始开发 QUIC 应用程序！开发容器提供了，跨不同机器的一致开发环境,并确保所有开发人员使用相同的工具和库。来吧，浪起来！

[Docker Desktop]: https://www.docker.com/products/docker-desktop
[Dev Container specification]: https://containers.dev/implementors/json_reference/
[QUIC in .NET]: https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/quic/quic-overview
[VS Code]: https://code.visualstudio.com/
[Dev Containers]: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers