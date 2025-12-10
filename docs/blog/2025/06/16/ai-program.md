请根据我的需求帮我编写 Python 脚本。

1、登录获取 token，通过对 http://10.29.25.41:8012/pmLogin/logincheck 发起post请求，body 是 json 格式，如{"username":"abc","password": "123"}，返回体是类似以下的 json :  {    "allowRetry": null,

    "errorCode": null,

    "errorMsg": null,

"module":{"token":"this is the token should return",...},}

2、通过步骤1获取的 token 发起请求。http://10.29.25.41:8012/productPbi/getIterationLatestProductVersionData,该请求的 curl 命令如下：

```sh

curl --location 'http://10.29.25.41:8012/productPbi/getIterationLatestProductVersionData' \
--header 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTAwNTI1MTksInRva2VuQm9keSI6eyJ1c2VybmFtZSI6ImR3Z2hhZG1pbiIsInBhc3N3b3JkIjoiMDdGNzUwN0FFQjM5QzZDRDkyNjI4MTREREEwNUFBMzEiLCJlbXBJZCI6ImR3Z2hhZG1pbiIsImZyb21UZW5hbnRJZCI6InByb2plY3QtZHdnaCIsInRvVGVuYW50SWQiOiJwcm9qZWN0LWR3Z2giLCJhZG1pbiI6ZmFsc2V9fQ.KV5AgsGO28DJv5XjYKTTbP8I5GHHSc1pNc9RTUbJ7Fw' \
--header 'Content-Type: application/json' \

--data '{
  "versionId": "DD198446753296672"
}'

返回该接口数据数据样例如下：

```json
{
    "allowRetry": null,
    "errorCode": null,
    "errorMsg": null,
    "moule": [
            {
            "associateProduct": null,
            "associateProductName": null,
            "belongProductCode": null,
            "createTime": null,
            "id": 1278,
            "operationMaintenanceUnit": "",
            "operationTeam": "xxx团队",
            "parentProductCode": null,
            "parentProductName": null,
            "productCode": "2202303110028",
            "productConstructionMode": "自主研发",
            "productDesc": "***",
            "productFzr": "罗**",
            "productFzrWorkCode": "03330",
            "productLineCode": "1202303070001",
            "productLineName": "零售客户服务",
            "productLineStatus": null,
            "productName": "xxxx",
            "productSecondDepartmentDirector": "xx",
            "productSecondDepartmentLeader": "xx",
            "productSstd": "xx团队",
            "productSstdId": "1291",
            "productSstdSecondDepartment": "xx团队",
            "productStatus": "服务中",
            "productTeamLeader": "*辉",
            "productType": "L1",
            "productVersionCode": "GA20250517008",
            "productVersionName": "B-5.0",
            "productVersionStatus": "0",
            "serviceObject": "xxxx",
            "systemConstructionUnit": "",
            "systemManager": "xxx",
            "systemManagerB": "xxx",
            "systemManagerBWorkCode": "04882",
            "systemManagerC": null,
            "systemManagerCWorkCode": null,
            "systemManagerWorkCode": "03330",
            "type": "1",
            "updateTime": null,
            "versionCoreObjective": "xxxx",
            "versionServiceStatus": "2"
        },
    ]
}
```

3，将第二步返回的数据中 module 中的列表数据按照id更新插入表pbi_product中，并自动更新 update_at 和 created_at。该表建表语句如下：
```sql
CREATE TABLE secAdmin.pbi_product
	(
	  id                                 BIGINT UNSIGNED NOT NULL auto_increment
	, created_at                         DATETIME (3)
	, updated_at                         DATETIME (3)
	, deleted_at                         DATETIME (3)
	, associate_product                  VARCHAR (191)
	, associate_product_name             VARCHAR (191)
	, belong_product_code                VARCHAR (191)
	, create_time                        DATETIME (3)
	, operation_maintenance_unit         VARCHAR (191)
	, operation_team                     VARCHAR (191)
	, parent_product_code                VARCHAR (191)
	, parent_product_name                VARCHAR (191)
	, product_code                       VARCHAR (191)
	, product_construction_mode          VARCHAR (191)
	, product_desc                       TEXT
	, product_fzr                        VARCHAR (191)
	, product_fzr_work_code              VARCHAR (191)
	, product_line_code                  VARCHAR (191)
	, product_line_name                  VARCHAR (191)
	, product_line_status                VARCHAR (191)
	, product_name                       VARCHAR (191)
	, product_second_department_director VARCHAR (191)
	, product_second_department_leader   VARCHAR (191)
	, product_sstd                       VARCHAR (191)
	, product_sstd_id                    VARCHAR (191)
	, product_sstd_second_department     VARCHAR (191)
	, product_status                     VARCHAR (191)
	, product_team_leader                VARCHAR (191)
	, product_type                       VARCHAR (191)
	, product_version_code               VARCHAR (191)
	, product_version_name               VARCHAR (191)
	, product_version_status             VARCHAR (191)
	, service_object                     TEXT
	, system_construction_unit           VARCHAR (191)
	, system_manager                     VARCHAR (191)
	, system_manager_b                   VARCHAR (191)
	, system_manager_c                   VARCHAR (191)
	, t_type                             VARCHAR (191)
	, update_time                        DATETIME (3)
	, version_core_objective             TEXT
	, version_service_status             VARCHAR (191)
	, PRIMARY KEY (id)
	, KEY idx_pbi_product_deleted_at (deleted_at)
	);
```

