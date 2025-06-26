import { Storage } from "@google-cloud/storage";

const populateGCS = async () => {
  const storage = new Storage({
    apiEndpoint: "http://localhost:4443",
    projectId: "test-project",
  });

  const bucketName = "bucket";
  await storage.createBucket(bucketName);
};

populateGCS();
