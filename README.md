# moemachine

Download anime with ease.

# How to use

Install moemachine
```
npm -g https://github.com/EaterOfCode/moemachine
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
| t     | type           | Only accept results from a cetrain type (batch or eps) |
| b     | best           | Skip manual pick and do what's best for me             |
| q     | qaulity        | Only accept results from certain qaulity               |
| g     | group          | Only accept results from certain grup                  |
| P     | path           | Path to save downloaded files at (for eps it will be downloaded in a folder with the title as name) |
| h     | help           | Show help                                              |