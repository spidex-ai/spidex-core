module-create:
	yarn nest g module modules/${name}
	yarn nest g controller modules/${name} --no-spec
	yarn nest g service modules/${name} --no-spec
	yarn nest g class modules/${name}/dtos/${name}-response.dto --no-spec --flat
	yarn nest g class modules/${name}/dtos/${name}-request.dto --no-spec --flat

run-infra:
	docker compose -f docker-compose.infra.yml up -d

generate-migration:
	npx env-cmd ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/ormconfig.ts --pretty src/database/migrations/${name}

run-migration:
	npm run db:migration:run

run-seed:
	npm run db:seed

onboard:
	make run-infra
	make run-migration
	make run-seed

