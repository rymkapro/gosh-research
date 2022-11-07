while true 
do
	node test_replay_sdk.js > $(date +%s).log &
	sleep 2
done
