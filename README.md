# moemachine

Download anime with ease.

# How to use

Install moemachine
```
npm i -g https://github.com/EaterOfCode/moemachine
```

Then run moemachine with the title

```
moemachine "Log Horizon"
```

This will give you an option menu in which you can select a certain release.

After having selected one it will be added to your transmission client.

## Options


| Short | Long[=default] | Description                                            |
| ----- | -------------- | ------------------------------------------------------ |
| p     | port=9091      | Port where transmission is running at                  |
| H     | host=localhost | Host where transmission is running at                  |
| a     | auth           | Authenitcation string for transission given in user:pass |
| t     | type           | Only accept results from a cetrain type (batch or eps) |
| b     | best           | Skip manual pick and do what's best for me             |
| q     | qaulity        | Only accept results from certain qaulity               |
| g     | group          | Only accept results from certain grup                  |
| P     | path           | Path to save downloaded files at (for eps it will be downloaded in a folder with the title as name) |
| h     | help           | Show help                                              |
| s     | strict         | Only strict matches are used (recommend for full automated adding)                          |
| S     | scores         | Show scores with explaination                          |
| c     | config         | Load config from alternative path (default is ~/.moemachine) |
| T     | tracker        | Add several trackers to the given torrent              |

## Config

On default the config is gracefully loaded from `~/.moemachine`

```
{
	"port":9091, // port where transmission is running at
	"host":"localhost", // host transmission is running at
	"auth": false, // Authenitcation string for transission given in user:pass 
	"path": false, // Path to save downloaded files
	"scores":{ // Edit the scores from certain tests
		"IS_DEAD": -10, 
		"IS_DYING": -1,
		"ENOUGH_SEEDS": 1,
		"IS_FAMOUS": 2,
		"SEEMS_UNSTABLE": -1,
		"LOW_QAULITY":-1,
		"HIGH_QAULITY": 1
	}
}
```

## Supported groups

- HorribleSubs
- DeadFish
- Coalgirls

If you want one added, please create an issue with a link to the nyaa.se user